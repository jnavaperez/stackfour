use axum::Router;
use axum::routing::get;

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/uncle_paul", get(|| async { "I'm uncle Paul" }))
        .route("/", get(|| async { "Hello, world!" }))
        .route("/about", get(|| async { "About me!" }));

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await.unwrap();
    println!("Listening on: {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}
