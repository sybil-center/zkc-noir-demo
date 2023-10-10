use dep::std;

struct PassportCred {
    isr_id_t: [u8; 2],
    isr_id_k_x: [u8; 32],
    isr_id_k_y: [u8; 32],
    sch: [u8; 2],
    isd: [u8; 8],
    exd: [u8; 8],
    sbj_id_t: [u8; 2],
    sbj_id_k: [u8; 20],
    sbj_bd: [u8; 8],
    sbj_cc: [u8; 2],
    sbj_doc_id: [u8; 32],
    sbj_doc_t: [u8; 2]
}

fn main(
    signature: pub [u8; 64],
    cred: PassportCred
    ) {
        let hash = std::hash::sha256(toBytes(cred));
        let verified = std::ecdsa_secp256k1::verify_signature(cred.isr_id_k_x, cred.isr_id_k_y, signature, hash);
        assert(verified);
}

unconstrained fn toBytes(cred: PassportCred) -> [u8; 150] {
    let mut u8array: [u8; 150] = [0; 150];
    let mut counter: Field = 0;
    for i in 0..cred.isr_id_t.len() {
        u8array[counter] = cred.isr_id_t[i];
        counter += 1;
    }
    for i in 0..cred.isr_id_k_x.len() {
        u8array[counter] = cred.isr_id_k_x[i];
        counter += 1;
    }
    for i in 0..cred.isr_id_k_y.len() {
        u8array[counter] = cred.isr_id_k_y[i];
        counter += 1;
    }
    for i in 0..cred.sch.len() {
        u8array[counter] = cred.sch[i];
        counter += 1;
    }
    for i in 0..cred.isd.len() {
        u8array[counter] = cred.isd[i];
        counter += 1;
    }
    for i in 0..cred.exd.len() {
        u8array[counter] = cred.exd[i];
        counter += 1;
    }
    for i in 0..cred.sbj_id_t.len() {
        u8array[counter] = cred.sbj_id_t[i];
        counter += 1;
    }
    for i in 0..cred.sbj_id_k.len() {
        u8array[counter] = cred.sbj_id_k[i];
        counter += 1;
    }
    for i in 0..cred.sbj_bd.len() {
        u8array[counter] = cred.sbj_bd[i];
        counter += 1;
    }
    for i in 0..cred.sbj_cc.len() {
        u8array[counter] = cred.sbj_cc[i];
        counter += 1;
    }
    for i in 0..cred.sbj_doc_id.len() {
        u8array[counter] = cred.sbj_doc_id[i];
        counter += 1;
    }
    for i in 0..cred.sbj_doc_t.len() {
        u8array[counter] = cred.sbj_doc_t[i];
        counter += 1;
    }

    u8array
}

