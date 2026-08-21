import asyncio, httpx, json, time

BASE = "https://merchantapi.leopardscourier.com"
KEY = "487F7B22F68312D2C1BBC93B1AEA445B1730968523"
PW = "Eligo@407"

async def track_batch(c, cns):
    """Track a batch, return valid packets."""
    try:
        r = await c.post(f"{BASE}/api/trackBookedPacket/format/json/", data={
            "api_key": KEY, "api_password": PW,
            "track_numbers": ",".join(cns),
        })
        data = r.json()
        pl = data.get("packet_list")
        if isinstance(pl, list):
            return pl
        return []
    except:
        return []

async def track_individual(c, cn):
    """Track single CN, return packet or None."""
    packets = await track_batch(c, [cn])
    return packets[0] if packets else None

async def test():
    """Scan CN ranges around known valid CNs to discover all shipments."""
    
    # Known valid CNs (from our initial config):
    # ID7536607771, ID7536607772, ID7536607773, ID7536607778
    # ID7536614074, ID7536667902, ID7540816875
    # ID75361956, ID75361853, ID75361407, ID75361258 (DB CNs that are invalid individually)
    
    # The valid CN numbers are around: 7536607771-7540816875
    # That's a range of ~4.2M numbers. Let's try a smarter approach:
    # Scan the DB CNs individually first to see if they work
    
    print("=== Phase 1: Test all known DB CNs individually ===")
    async with httpx.AsyncClient(timeout=30.0) as c:
        db_cns = ["ID75360419","ID75361258","ID75361407","ID75361853","ID75361956","ID75364557","ID75364628","ID75364926","ID75365153","ID7544745"]
        valid_db = []
        for cn in db_cns:
            p = await track_individual(c, cn)
            if p:
                valid_db.append(cn)
                print(f"  VALID: {cn} -> {p.get('booked_packet_status')}")
            else:
                print(f"  INVALID: {cn}")
    
    print(f"\n=== Phase 2: Scan around known valid CNs ===")
    # The initial CNs form clusters. Let's scan around each cluster:
    # Cluster 1: ID7536607771-778 (7536607771-7536607778)
    # Cluster 2: ID7536614074
    # Cluster 3: ID7536667902
    # Cluster 4: ID7540816875
    
    # Let's scan wider ranges around these clusters
    scan_ranges = [
        (7536600000, 7536607800),   # Just before cluster 1
        (7536607779, 7536607900),   # Just after cluster 1
        (7536610000, 7536614200),   # Around cluster 2
        (7536660000, 7536668000),   # Around cluster 3
        (7540810000, 7540820000),   # Around cluster 4
        (7536400000, 7536500000),   # Around DB CNs
    ]
    
    found_cns = []
    total_scanned = 0
    
    async with httpx.AsyncClient(timeout=30.0) as c:
        for start, end in scan_ranges:
            batch = []
            for num in range(start, end):
                cn = f"ID{num}"
                batch.append(cn)
                
                if len(batch) >= 10:
                    total_scanned += len(batch)
                    packets = await track_batch(c, batch)
                    for p in packets:
                        tn = p.get("track_number")
                        if tn and tn not in [x.get("track_number") for x in found_cns]:
                            found_cns.append(p)
                            print(f"  FOUND: {tn} -> {p.get('booked_packet_status')} | {p.get('consignment_name_eng','?')}")
                    batch = []
                    
                    # Rate limit
                    if total_scanned % 100 == 0:
                        await asyncio.sleep(0.5)
            
            # Process remaining
            if batch:
                total_scanned += len(batch)
                packets = await track_batch(c, batch)
                for p in packets:
                    tn = p.get("track_number")
                    if tn and tn not in [x.get("track_number") for x in found_cns]:
                        found_cns.append(p)
                        print(f"  FOUND: {tn} -> {p.get('booked_packet_status')} | {p.get('consignment_name_eng','?')}")
    
    print(f"\n=== RESULTS ===")
    print(f"Scanned: {total_scanned} CNs")
    print(f"Found: {len(found_cns)} valid shipments")
    for p in found_cns:
        print(f"  {p.get('track_number')} | {p.get('booked_packet_status')} | Order: {p.get('booked_packet_order_id')} | {p.get('consignment_name_eng','?')} | Rs {p.get('booked_packet_collect_amount','?')}")

asyncio.run(test())
