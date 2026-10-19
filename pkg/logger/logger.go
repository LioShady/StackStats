package logger

import (
	"io"
	"log/slog"
	"os"
)

// New создаёт slog.Logger, пишущий и в файл, и в stderr (удобно на dev).
// opts: AddSource добавляет имя файла и строку.
func New(path string) (*slog.Logger, *os.File, error) {
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o666)
	if err != nil {
		return nil, nil, err
	}

	w := io.MultiWriter(os.Stdout, f)
	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level:     slog.LevelDebug,
		AddSource: true,
	})
	return slog.New(handler), f, nil
}
