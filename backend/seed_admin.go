package main

import (
	"log"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID        uint           `gorm:"primaryKey"`
	Email     string         `gorm:"uniqueIndex;not null"`
	Name      string         `gorm:"not null"`
	Password  string         `gorm:"not null"`
	Role      string         `gorm:"default:'customer'"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func main() {
	dsn := "host=localhost user=root password=secretpassword dbname=ecommerce port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	admin := User{
		Email:    "admin@gmail.com",
		Name:     "Admin User",
		Password: string(hashedPassword),
		Role:     "admin",
	}

	var existing User
	if err := db.Where("email = ?", admin.Email).First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&admin).Error; err != nil {
				log.Fatal(err)
			}
			log.Println("Admin user seeded successfully")
		} else {
			log.Fatal(err)
		}
	} else {
		// Update existing user to be admin and reset password
		existing.Role = "admin"
		existing.Password = string(hashedPassword)
		db.Save(&existing)
		log.Println("Admin user already exists, updated role and password")
	}
}
