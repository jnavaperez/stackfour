use std::{env, fs};

fn main() {
    println!("cargo::rustc-check-cfg=cfg(docker)");
    // Check if the /.dockerenv file exists (standard Docker marker)
    let is_docker = env::var("IS_DOCKER").is_ok();

    if is_docker {
        println!("cargo:rustc-cfg=docker");
    }
}