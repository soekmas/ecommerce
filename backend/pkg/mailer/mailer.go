package mailer

import (
	"fmt"
	"net/smtp"

	"github.com/vibecoding/ecommerce/config"
)

type Mailer interface {
	SendVerificationEmail(toEmail, name, token string) error
	SendOrderStatusEmail(toEmail, name, orderNumber, status string) error
}

type smtpMailer struct {
	cfg *config.Config
}

func NewSMTPMailer(cfg *config.Config) Mailer {
	return &smtpMailer{cfg: cfg}
}

func (m *smtpMailer) SendVerificationEmail(toEmail, name, token string) error {
	smtpHost := "localhost"
	smtpPort := "1025"
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	subject := "Verify your Go-Commerce account"
	verifyURL := fmt.Sprintf("http://localhost:5173/verify?token=%s", token)

	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			.container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0; }
			.header { text-align: center; margin-bottom: 40px; }
			.logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -1px; }
			.content { text-align: center; color: #4b5563; line-height: 1.6; }
			.button { display: inline-block; padding: 16px 32px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; margin-top: 32px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
			.footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<div class="logo">GO-COMMERCE</div>
			</div>
			<div class="content">
				<h2 style="color: #111827; font-weight: 800;">Welcome to the Premium Club!</h2>
				<p>Hello %s, we're excited to have you. Please verify your email to unlock all features.</p>
				<a href="%s" class="button">Verify My Account</a>
				<p style="margin-top: 32px; font-size: 14px;">Verification Link (expires in 24h):<br><span style="color: #2563eb;">%s</span></p>
			</div>
			<div class="footer">
				&copy; 2026 Go-Commerce. Premium Shopping Experience.
			</div>
		</div>
	</body>
	</html>`, name, verifyURL, verifyURL)

	msg := fmt.Sprintf("From: Go-Commerce <noreply@go-commerce.local>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n"+
		"%s", toEmail, subject, body)

	return smtp.SendMail(addr, nil, "noreply@go-commerce.local", []string{toEmail}, []byte(msg))
}

func (m *smtpMailer) SendOrderStatusEmail(toEmail, name, orderNumber, status string) error {
	smtpHost := "localhost"
	smtpPort := "1025"
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)

	subject := fmt.Sprintf("Order Update: %s - %s", orderNumber, status)
	
	body := fmt.Sprintf(`
	<!DOCTYPE html>
	<html>
	<head>
		<style>
			.container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0; }
			.header { text-align: center; margin-bottom: 40px; }
			.logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -1px; }
			.status-badge { display: inline-block; padding: 6px 12px; background: #eff6ff; color: #2563eb; border-radius: 99px; font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; }
			.content { text-align: center; color: #4b5563; line-height: 1.6; }
			.button { display: inline-block; padding: 16px 32px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; margin-top: 32px; }
			.footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<div class="logo">GO-COMMERCE</div>
			</div>
			<div class="content">
				<div class="status-badge">%s</div>
				<h2 style="color: #111827; font-weight: 800;">Order Update</h2>
				<p>Hello %s, your order <strong>%s</strong> has been updated.</p>
				<p>Order Status: <span style="color: #111827; font-weight: 700;">%s</span></p>
				<a href="http://localhost:5173/orders" class="button">Track Order Detail</a>
			</div>
			<div class="footer">
				&copy; 2026 Go-Commerce. Questions? contact support@go-commerce.local
			</div>
		</div>
	</body>
	</html>`, status, name, orderNumber, status)

	msg := fmt.Sprintf("From: Go-Commerce <noreply@go-commerce.local>\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=\"UTF-8\"\r\n\r\n"+
		"%s", toEmail, subject, body)

	return smtp.SendMail(addr, nil, "noreply@go-commerce.local", []string{toEmail}, []byte(msg))
}
