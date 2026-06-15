use std::fs;

fn main() {
    // Check if the /.dockerenv file exists (standard Docker marker)
    let is_docker = fs::metadata("/.dockerenv").is_ok();

    if is_docker {
        println!("cargo:rustc-cfg=docker");
    }
}