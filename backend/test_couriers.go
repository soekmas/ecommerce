package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	apiKey := "biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZ29jb21tZXJjZSIsInVzZXJJZCI6IjY3MTFkNzllY2JlNTU3MDAxMWZlYzRmNSIsImlhdCI6MTc3NDg2MzU5Mn0.qSWSZdy27j1mEl-pdZiCVuRPgqtzi_knauCkFNqyIrE"
	url := "https://api.biteship.com/v1/couriers"

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Response: %.200s...\n", string(body)) // Show first 200 chars
}
