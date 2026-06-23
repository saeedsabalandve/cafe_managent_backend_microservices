// services/order-service/cmd/server/main.go
// #order-service #entry-point #gin-server #mongodb #graceful-shutdown

package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"order-service/internal/config"
	"order-service/internal/handlers"
	"order-service/internal/repository"
	"order-service/internal/services"
	"order-service/internal/websocket"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"go.mongodb.org/mongo-driver/mongo/readpref"
)

func main() {
	// #load-config
	cfg := config.Load()

	// #mongodb-connection-pool
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoClient, err := mongo.Connect(ctx, options.Client().
		ApplyURI(cfg.MongoURI).
		SetMaxPoolSize(50).
		SetMinPoolSize(10).
		SetMaxConnIdleTime(5*time.Minute),
	)
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}

	if err := mongoClient.Ping(ctx, readpref.Primary()); err != nil {
		log.Fatalf("MongoDB ping failed: %v", err)
	}
	log.Println("MongoDB connected")

	// #initialize-dependencies
	db := mongoClient.Database("order_db")
	orderRepo := repository.NewOrderRepository(db)
	orderService := services.NewOrderService(orderRepo)
	wsHub := websocket.NewHub()
	go wsHub.Run()

	// #gin-router-setup
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	orderHandler := handlers.NewOrderHandler(orderService, wsHub)

	// #routes
	api := router.Group("/api/orders")
	{
		api.POST("", orderHandler.CreateOrder)
		api.GET("/active", orderHandler.GetActiveOrders)
		api.GET("/:id", orderHandler.GetOrder)
		api.PUT("/:id/status", orderHandler.UpdateOrderStatus)
		api.POST("/:id/cancel", orderHandler.CancelOrder)
		api.GET("/kitchen/ws", orderHandler.KitchenWebSocket)
	}

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "order-service",
		})
	})

	// #http-server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", cfg.Port),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("Order Service starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// #graceful-shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("Server forced shutdown: %v", err)
	}
	mongoClient.Disconnect(shutdownCtx)
	log.Println("Order Service stopped")
}
