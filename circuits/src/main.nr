use dep::std;

struct Uint256 {
    v: [Field; 2]
}

impl Uint256 {
    fn to_bytes(self) -> [u8; 32] {
        let mut bytes: [u8; 32] = [0; 32];

        let one = self.v[0].to_be_bytes(16);
        let two = self.v[1].to_be_bytes(16);
        for i in 0..16 {
            bytes[i] = one[i];
            bytes[i + 16] = two[i];
        }

        bytes
    }

    fn assertEquals(self, other: Uint256) {
        for i in 0..2 {
            let self_part = self.v[i];
            let other_part = other.v[i];
            assert(self_part == other_part);
        }
    }
}

struct Uint512 {
    v: [Field; 4]
}

impl Uint512 {

    fn to_bytes(self) -> [u8; 64] {
        let mut bytes: [u8; 64] = [0; 64];

        let one = self.v[0].to_be_bytes(16);
        let two = self.v[1].to_be_bytes(16);
        let three = self.v[2].to_be_bytes(16);
        let four = self.v[3].to_be_bytes(16);
        for i in 0..16 {
            bytes[i] = one[i];
            bytes[i + 16] = two[i];
            bytes[i + 32] = three[i];
            bytes[i + 48] = four[i];
        }
        bytes
    }

    fn to_2x32_bytes(self) -> [[u8;32]; 2] {
        let mut first_bytes: [u8; 32] = [0; 32];
        let mut second_bytes: [u8; 32] = [0; 32];
        
        let one = self.v[0].to_be_bytes(16);
        let two = self.v[1].to_be_bytes(16);
        let three = self.v[2].to_be_bytes(16);
        let four = self.v[3].to_be_bytes(16);
        for i in 0..16 {
            first_bytes[i] = one[i];
            first_bytes[i +  16] = two[i];
            second_bytes[i] = three[i];
            second_bytes[i + 16] = four[i];
        }
        [first_bytes, second_bytes]
    }

    fn assertEquals(self, other: Uint512) {
        for i in 0..4 {
            let self_part = self.v[i];
            let other_part = other.v[i];
            assert(self_part == other_part);
        }
    }
}

struct PassportCred {
    isr_id_t: u16,
    isr_id_k: Uint512,
    sch: u16,
    isd: u64,
    exd: u64,
    sbj_id_t: u16,
    sbj_id_k: Field,
    sbj_bd: u64,
    sbj_cc: u16,
    sbj_doc_id: Uint256,
    sbj_doc_t: u16,
    sbj_fn: Field,
    sbj_ln: Field
}

impl PassportCred {
    fn to_bytes(self) -> [u8; 182] {
        let mut bytes: [u8; 182] = [0; 182];
        let mut count = 0;
        for i in 0..2 {
            bytes[count] = (self.isr_id_t >> (8 - (i * 8))) as u8;
            count += 1;
        }
        let isr_id_k_bytes = self.isr_id_k.to_bytes();
        for i in 0..isr_id_k_bytes.len() {
            bytes[count] = isr_id_k_bytes[i];
            count += 1;
        }
        for i in 0..2 {
            bytes[count] = (self.sch >> (8 - (i * 8))) as u8;
            count += 1;
        }
        for i in 0..8 {
            bytes[count] = (self.isd >> (56 - (i * 8))) as u8;
            count += 1;
        }
        for i in 0..8 {
            bytes[count] = (self.exd >> (56 - (i * 8))) as u8;
            count += 1;
        }
        for i in 0..2 {
            bytes[count] = (self.sbj_id_t >> (8 - (i * 8))) as u8;
            count += 1;
        }
        let sbj_id_k = self.sbj_id_k.to_be_bytes(20);
        for i in 0..20 {
            bytes[count] = sbj_id_k[i];
            count += 1;
        }
        for i in 0..8 {
            bytes[count] = (self.sbj_bd >> (56 - (i * 8))) as u8;
            count += 1;
        }
        for i in 0..2 {
            bytes[count] = (self.sbj_cc >> (8 - (i * 8))) as u8;
            count += 1;
        }
        let sbj_doc_id = self.sbj_doc_id.to_bytes();
        for i in 0..sbj_doc_id.len() {
            bytes[count] = sbj_doc_id[i];
            count += 1;
        }
        for i in 0..2 {
            bytes[count] = (self.sbj_doc_t >> (8 - (i * 8))) as u8;
            count += 1;
        }
        let sbj_fn = self.sbj_fn.to_be_bytes(16);
        for i in 0..16 {
            bytes[count] = sbj_fn[i];
            count += 1;
        }
        let sbj_ln = self.sbj_ln.to_be_bytes(16);
        for i in 0..16 {
            bytes[count] = sbj_ln[i];
            count += 1;
        }
        bytes
    }
}


fn main(
    issuer_id: pub Uint512,
    subject_address: pub Field,
    current_date: pub u64,
    sign: Uint512,
    cred: PassportCred
) {
    assert(((current_date + 2208988800000) - cred.sbj_bd) > 18*365*24*60*60*1000);
    issuer_id.assertEquals(cred.isr_id_k);
    assert(subject_address == cred.sbj_id_k);
    let isr_id_k = cred.isr_id_k.to_2x32_bytes();
    let hash = std::hash::sha256(cred.to_bytes());
    let valid_sign = std::ecdsa_secp256k1::verify_signature(isr_id_k[0], isr_id_k[1], sign.to_bytes(), hash); 
    assert(valid_sign);
}

