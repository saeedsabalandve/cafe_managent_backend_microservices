// services/order-service/internal/config/config.go
// #configuration #environment-variables

package config

import "os"

type Config struct {
	Port        string
	Environment string
	MongoURI    string
	RedisURL    string
	WsPingInterval int
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "3003"),
		Environment: getEnv("GIN_MODE", "debug"),
		MongoURI:    getEnv("MONGO_URI", "mongodb://mongo-order:27017/order_db"),
		RedisURL:    getEnv("REDIS_URL", "redis:6379"),
		WsPingInterval: 30,
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
