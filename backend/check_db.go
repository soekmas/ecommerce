package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/vibecoding/ecommerce/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=user password=password dbname=gocommerce port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	var products []domain.Product
	if err := db.Find(&products).Error; err != nil {
		log.Fatalf("failed to fetch products: %v", err)
	}

	for _, p := range products {
		if p.SpecialPrice != nil {
			pj, _ := json.MarshalIndent(p, "", "  ")
			fmt.Println(string(pj))
		}
	}
}
