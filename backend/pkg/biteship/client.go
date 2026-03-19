package biteship

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/vibecoding/ecommerce/config"
)

type Client interface {
	GetRates(req *RatesRequest) (*RatesResponse, error)
	CreateOrder(req *OrderRequest) (*OrderResponse, error)
}

type biteshipClient struct {
	cfg        *config.Config
	httpClient *http.Client
	baseURL    string
}

func NewBiteshipClient(cfg *config.Config) Client {
	return &biteshipClient{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: "https://api.biteship.com/v1",
	}
}

type DeliveryItem struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Value       int64  `json:"value"`
	Length      int    `json:"length"` // in cm
	Width       int    `json:"width"`  // in cm
	Height      int    `json:"height"` // in cm
	Weight      int    `json:"weight"` // in gram
	Quantity    int    `json:"quantity"`
}

type RatesRequest struct {
	OriginLatitude        float64        `json:"origin_latitude,omitempty"`
	OriginLongitude       float64        `json:"origin_longitude,omitempty"`
	DestinationLatitude   float64        `json:"destination_latitude,omitempty"`
	DestinationLongitude  float64        `json:"destination_longitude,omitempty"`
	OriginPostalCode      string         `json:"origin_postal_code,omitempty"`
	DestinationPostalCode string         `json:"destination_postal_code,omitempty"`
	Couriers              string         `json:"couriers"` // e.g., "jne,jnt,sicepat"
	Items                 []DeliveryItem `json:"items"`
}

type CourierRate struct {
	CourierName   string `json:"courier_name"`
	CourierCode   string `json:"courier_code"`
	CourierSvc    string `json:"courier_service_name"`
	ServiceType   string `json:"courier_service_code"`
	Price         int64  `json:"price"`
	EstimatedDays string `json:"duration"`
}

type RatesResponse struct {
	Success bool          `json:"success"`
	Message string        `json:"message"`
	Object  string        `json:"object"`
	Pricing []CourierRate `json:"pricing"`
}

type OrderRequest struct {
	OriginContactName          string         `json:"origin_contact_name"`
	OriginContactPhone         string         `json:"origin_contact_phone"`
	OriginAddress              string         `json:"origin_address"`
	OriginLatitude             float64        `json:"origin_latitude,omitempty"`
	OriginLongitude            float64        `json:"origin_longitude,omitempty"`
	OriginPostalCode           string         `json:"origin_postal_code"`
	DestinationContactName     string         `json:"destination_contact_name"`
	DestinationContactPhone    string         `json:"destination_contact_phone"`
	DestinationAddress         string         `json:"destination_address"`
	DestinationLatitude        float64        `json:"destination_latitude,omitempty"`
	DestinationLongitude       float64        `json:"destination_longitude,omitempty"`
	DestinationPostalCode      string         `json:"destination_postal_code"`
	Couriers                   string         `json:"couriers"`
	Items                      []DeliveryItem `json:"items"`
}

type OrderResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	ID      string `json:"id"`
	Courier struct {
		TrackingID string `json:"tracking_id"` // This is the AWB
		WaybillID  string `json:"waybill_id"`
	} `json:"courier"`
}

func (c *biteshipClient) GetRates(req *RatesRequest) (*RatesResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", c.baseURL+"/rates/couriers", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.cfg.BiteshipKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("biteship API error: status %d - %s", resp.StatusCode, string(body))
	}

	var ratesResp RatesResponse
	if err := json.Unmarshal(body, &ratesResp); err != nil {
		return nil, err
	}

	return &ratesResp, nil
}
