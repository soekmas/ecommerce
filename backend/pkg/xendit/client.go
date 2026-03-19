package xendit

import (
	"fmt"
	"github.com/xendit/xendit-go"
	"github.com/xendit/xendit-go/invoice"
)

type Client interface {
	CreateInvoice(orderID string, amount int64, customerEmail string, customerName string) (*xendit.Invoice, error)
}

type xenditClient struct {
	secretKey string
}

func NewClient(secretKey string) Client {
	xendit.Opt.SecretKey = secretKey
	return &xenditClient{secretKey: secretKey}
}

func (c *xenditClient) CreateInvoice(orderID string, amount int64, customerEmail string, customerName string) (*xendit.Invoice, error) {
	data := &invoice.CreateParams{
		ExternalID:  orderID,
		Amount:      float64(amount),
		PayerEmail:  customerEmail,
		Description: fmt.Sprintf("Payment for Order %s", orderID),
	}

	resp, err := invoice.Create(data)
	if err != nil {
		return nil, err
	}

	return resp, nil
}
