package biteship // continuing from client.go

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

func (c *biteshipClient) CreateOrder(req *OrderRequest) (*OrderResponse, error) {
	// Fallback mock if using placeholder key to allow testing without Biteship account
	if c.cfg.BiteshipKey == "biteship_staging_key_here" || c.cfg.BiteshipKey == "" {
		return &OrderResponse{
			Success: true,
			Message: "Order successfully created (Mocked)",
			ID:      fmt.Sprintf("mock-biteship-%d", time.Now().UnixNano()),
			Courier: struct {
				TrackingID string `json:"tracking_id"`
				WaybillID  string `json:"waybill_id"`
			}{
				TrackingID: fmt.Sprintf("AWB%dID", time.Now().Unix()),
				WaybillID:  fmt.Sprintf("WB%dID", time.Now().Unix()),
			},
		}, nil
	}

	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", c.baseURL+"/orders", bytes.NewBuffer(jsonData))
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

	var orderResp OrderResponse
	if err := json.Unmarshal(body, &orderResp); err != nil {
		return nil, err
	}

	return &orderResp, nil
}
