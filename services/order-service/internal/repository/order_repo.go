// services/order-service/internal/repository/order_repo.go
// #mongodb-repository #aggregations

package repository

import (
	"context"
	"time"

	"order-service/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type OrderRepository struct {
	collection *mongo.Collection
}

func NewOrderRepository(db *mongo.Database) *OrderRepository {
	col := db.Collection("orders")
	
	// #create-indexes
	col.Indexes().CreateMany(context.Background(), []mongo.IndexModel{
		{Keys: bson.D{{Key: "cafe_id", Value: 1}, {Key: "status", Value: 1}}},
		{Keys: bson.D{{Key: "created_at", Value: -1}}},
	})
	
	return &OrderRepository{collection: col}
}

// #create-order
func (r *OrderRepository) Create(ctx context.Context, order *models.Order) error {
	result, err := r.collection.InsertOne(ctx, order)
	if err != nil {
		return err
	}
	order.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// #find-by-id
func (r *OrderRepository) FindByID(ctx context.Context, id string) (*models.Order, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var order models.Order
	err = r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&order)
	return &order, err
}

// #update-status-optimistic-lock
func (r *OrderRepository) UpdateStatus(ctx context.Context, id string, status models.OrderStatus, change models.StatusChange, version int) error {
	objID, _ := primitive.ObjectIDFromHex(id)

	result := r.collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID, "version": version},
		bson.M{
			"$set": bson.M{
				"status":     status,
				"updated_at": time.Now(),
			},
			"$inc": bson.M{"version": 1},
			"$push": bson.M{"status_history": change},
		},
	)

	return result.Err()
}

// #get-active-orders
func (r *OrderRepository) GetActiveOrders(ctx context.Context, cafeID string) ([]models.Order, error) {
	cursor, err := r.collection.Find(ctx, bson.M{
		"cafe_id": cafeID,
		"status": bson.M{
			"$in": []models.OrderStatus{models.StatusNew, models.StatusPreparing, models.StatusReady},
		},
	}, options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}}))

	if err != nil {
		return nil, err
	}

	var orders []models.Order
	if err := cursor.All(ctx, &orders); err != nil {
		return nil, err
	}
	return orders, nil
}
