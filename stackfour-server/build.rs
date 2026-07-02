use std::fs;

fn main() {
    println!("cargo::rustc-check-cfg=cfg(docker)");
    // Check if the /.dockerenv file exists (standard Docker marker)
    let is_docker = fs::metadata("/.dockerenv").is_ok();

    if is_docker {
        println!("cargo:rustc-cfg=docker");
    }
}