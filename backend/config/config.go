package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv     string
	Port       string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPass     string
	DBName     string
	RedisHost  string
	RedisPort  string
	RedisPass  string
	JWTSecret  string
	JWTExpire  int
	BiteshipKey string
	XenditSecretKey string
	XenditWebhookToken string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading it, using OS env vars")
	}

	jwtExpire, _ := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))

	return &Config{
		AppEnv:      getEnv("APP_ENV", "development"),
		Port:        getEnv("PORT", "8080"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBUser:      getEnv("DB_USER", "root"),
		DBPass:      getEnv("DB_PASSWORD", "secretpassword"),
		DBName:      getEnv("DB_NAME", "ecommerce"),
		RedisHost:   getEnv("REDIS_HOST", "localhost"),
		RedisPort:   getEnv("REDIS_PORT", "6379"),
		RedisPass:   getEnv("REDIS_PASSWORD", ""),
		JWTSecret:   getEnv("JWT_SECRET", "supersecretkey_change_in_production"),
		JWTExpire:   jwtExpire,
		BiteshipKey: getEnv("BITESHIP_API_KEY", ""),
		XenditSecretKey: getEnv("XENDIT_SECRET_KEY", ""),
		XenditWebhookToken: getEnv("XENDIT_WEBHOOK_TOKEN", ""),
	}
}

func getEnv(key string, defaultVal string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultVal
}
