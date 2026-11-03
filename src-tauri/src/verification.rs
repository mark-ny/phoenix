use sha2::{Digest, Sha256, Sha512};
use std::fs::File;
use std::io::{self, Read};
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum VerificationError {
    #[error("unsupported checksum algorithm: {0}")]
    UnsupportedAlgorithm(String),
    #[error("file could not be read: {0}")]
    Io(#[from] io::Error),
}

pub fn checksum_file(path: &Path, algorithm: &str) -> Result<String, VerificationError> {
    let mut file = File::open(path)?;
    let mut buffer = [0_u8; 1024 * 1024];
    match algorithm.to_ascii_lowercase().as_str() {
        "sha256" | "sha-256" => {
            let mut hasher = Sha256::new();
            loop {
                let read = file.read(&mut buffer)?;
                if read == 0 {
                    break;
                }
                hasher.update(&buffer[..read]);
            }
            Ok(hex::encode(hasher.finalize()))
        }
        "sha512" | "sha-512" => {
            let mut hasher = Sha512::new();
            loop {
                let read = file.read(&mut buffer)?;
                if read == 0 {
                    break;
                }
                hasher.update(&buffer[..read]);
            }
            Ok(hex::encode(hasher.finalize()))
        }
        other => Err(VerificationError::UnsupportedAlgorithm(other.to_string())),
    }
}

#[cfg(test)]
mod tests {
    use super::{checksum_file, VerificationError};
    use std::fs;

    #[test]
    fn computes_sha256_for_local_file() {
        let path = std::env::temp_dir().join("phoenix-checksum-test.txt");
        fs::write(&path, b"phoenix").expect("write test file");
        let checksum = checksum_file(&path, "sha256").expect("checksum file");
        fs::remove_file(&path).ok();
        assert_eq!(checksum.len(), 64);
    }

    #[test]
    fn rejects_unsupported_algorithm() {
        let path = std::env::temp_dir().join("phoenix-checksum-test.txt");
        fs::write(&path, b"phoenix").expect("write test file");
        let result = checksum_file(&path, "md5");
        fs::remove_file(&path).ok();
        assert!(matches!(
            result,
            Err(VerificationError::UnsupportedAlgorithm(_))
        ));
    }
}
