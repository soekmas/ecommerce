package main

import (
	"fmt"
	"log"

	"github.com/vibecoding/ecommerce/config"
	"github.com/vibecoding/ecommerce/pkg/database"
	"github.com/vibecoding/ecommerce/internal/domain"
)

func main() {
	cfg := config.LoadConfig()
	db, err := database.NewPostgresDB(cfg)
	if err != nil {
		log.Fatal(err)
	}

	var users []domain.User
	db.Find(&users)
	fmt.Println("Users:")
	for _, u := range users {
		fmt.Printf("ID: %d, Email: %s, Role: %s\n", u.ID, u.Email, u.Role)
	}

	var orders []domain.Order
	db.Preload("Items").Find(&orders)
	fmt.Printf("\nOrders Count: %d\n", len(orders))
	for _, o := range orders {
		fmt.Printf("Order: %s, Status: %s, Items: %d\n", o.OrderNumber, o.Status, len(o.Items))
	}
}
