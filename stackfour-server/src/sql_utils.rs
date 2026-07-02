use crate::{COLUMNS, ROWS};
use crate::types::{Team, GameBoard};

pub fn board_vec_into_2d_array<T>(v: &Vec<T>) -> &[[T; ROWS]; COLUMNS]  {
    assert_eq!(v.len(), 42);

    let ptr = v.as_ptr() as *const [[T; ROWS]; COLUMNS];

    unsafe {
        &*ptr
    }
}

pub fn array_2d_into_1d<T>(a:&[[T;ROWS];COLUMNS]) -> &[T;ROWS*COLUMNS] {
    unsafe {&*(a.as_ptr() as *const [T; ROWS*COLUMNS])}
}