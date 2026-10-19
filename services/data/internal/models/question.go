package model

type Question struct {
	Title string   `bson:"title"`
	Tags  []string `bson:"tags"`
	Body  string   `bson:"body"`
	Link  string   `bson:"link"` // уникальный индекс
}
