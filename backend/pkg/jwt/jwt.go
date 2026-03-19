package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/vibecoding/ecommerce/config"
)

type JWTClaim struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type TokenMaker interface {
	GenerateToken(userID uint, email string, role string) (string, error)
	VerifyToken(tokenString string) (*JWTClaim, error)
}

type jwtMaker struct {
	secretKey string
	expire    int
}

func NewJWTMaker(cfg *config.Config) TokenMaker {
	return &jwtMaker{
		secretKey: cfg.JWTSecret,
		expire:    cfg.JWTExpire,
	}
}

func (maker *jwtMaker) GenerateToken(userID uint, email string, role string) (string, error) {
	expirationTime := time.Now().Add(time.Duration(maker.expire) * time.Hour)

	claims := &JWTClaim{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(maker.secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (maker *jwtMaker) VerifyToken(tokenString string) (*JWTClaim, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaim{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(maker.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaim)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}
