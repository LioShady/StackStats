package models

type Question struct {
	Title string   `json:"title"`
	Tags  []string `json:"tags"`
	Body  string   `json:"body"` // HTML-код вопроса
	Link  string   `json:"link"`
}

type StackResponse struct {
	Items []Question `json:"items"`
}
