package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	apiKey := "biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZ29jb21tZXJjZSIsInVzZXJJZCI6IjY3MTFkNzllY2JlNTU3MDAxMWZlYzRmNSIsImlhdCI6MTc3NDg2MzU5Mn0.qSWSZdy27j1mEl-pdZiCVuRPgqtzi_knauCkFNqyIrE"
	url := "https://api.biteship.com/v1/rates/couriers"

	payload := map[string]interface{}{
		"origin_latitude":       -6.17511,
		"origin_longitude":      106.82715,
		"destination_latitude":  -6.200000,
		"destination_longitude": 106.816666,
		"origin_postal_code":    "10110",
		"destination_postal_code": "12190",
		"couriers":              "jne,sicepat",
		"items": []map[string]interface{}{
			{
				"name":     "Test Item",
				"value":    10000,
				"weight":   1000,
				"quantity": 1,
			},
		},
	}

	jsonData, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\n", resp.StatusCode)
	fmt.Printf("Response: %s\n", string(body))
}
