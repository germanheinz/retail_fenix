package repository

import (
	_ "embed"
	"encoding/json"
	"fmt"
)

//go:embed products.json
var productsString []byte

//go:embed tags.json
var tagsString []byte

type ProductData struct {
	Name        string   `json:"name"`
	Description string   `json:"description"`
	ID          string   `json:"id"`
	Price       int      `json:"price"`
	Tags        []string `json:"tags"`
	Artist      string   `json:"artist"`
	Venue       string   `json:"venue"`
	City        string   `json:"city"`
	Date        string   `json:"date"`
	Capacity    int      `json:"capacity"`
}

type ProductTagData struct {
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
}

func LoadProductData() ([]ProductData, error) {
	// Create a slice to hold the products
	var products []ProductData

	// Unmarshal JSON array into the slice
	err := json.Unmarshal(productsString, &products)
	if err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return products, nil
}

func LoadProductTagData() ([]ProductTagData, error) {
	// Create a slice to hold the products
	var productTags []ProductTagData

	// Unmarshal JSON array into the slice
	err := json.Unmarshal(tagsString, &productTags)
	if err != nil {
		return nil, fmt.Errorf("error parsing JSON: %v", err)
	}

	return productTags, nil
}
