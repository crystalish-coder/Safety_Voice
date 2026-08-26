import pandas as pd
import json

df = pd.read_excel('MSDS_list.xlsx')

def escape_sql(val):
    if val is None or pd.isnull(val):
        return 'NULL'
    s = str(val).strip()
    if s in ['-', 'N/A', 'nan', 'None']:
        return 'NULL'
    s = s.replace("'", "''")
    return f"'{s}'"

sql_lines = [
    '-- ==============================================================================--',
    '-- Import MSDS List (780 Items from MSDS_list.xlsx)',
    '-- ==============================================================================--',
    '',
    'INSERT INTO public.sds_documents (chemical_name, cas_number, product_number, manufacturer, language) VALUES'
]

values_list = []
json_records = []

for idx, row in df.iterrows():
    prod_no = row.iloc[0]
    chem_name = row.iloc[1]
    cas = row.iloc[2]
    amount = row.iloc[3]
    mfr = row.iloc[4]
    
    if pd.isnull(chem_name) or str(chem_name).strip() == '':
        continue
        
    chem_str = str(chem_name).strip()
    cas_str = str(cas).strip() if pd.notnull(cas) and str(cas).strip() not in ['-', 'N/A', 'nan', 'None'] else None
    prod_str = str(prod_no).strip() if pd.notnull(prod_no) and str(prod_no).strip() != 'nan' else None
    mfr_str = str(mfr).strip() if pd.notnull(mfr) and str(mfr).strip() != 'nan' else None
    
    chem_escaped = escape_sql(chem_name)
    cas_escaped = escape_sql(cas_str)
    prod_escaped = escape_sql(prod_str)
    mfr_escaped = escape_sql(mfr_str)
    
    values_list.append(f"({chem_escaped}, {cas_escaped}, {prod_escaped}, {mfr_escaped}, 'ko')")
    
    json_records.append({
        "id": f"sds-excel-{idx+1}",
        "chemical_name": chem_str,
        "cas_number": cas_str,
        "product_number": prod_str,
        "manufacturer": mfr_str,
        "revision_date": None,
        "language": "ko",
        "file_path": None,
        "external_url": None,
        "pubchem_cid": None,
        "verified_cas": True if cas_str else False,
        "created_at": "2026-08-26T00:00:00Z",
        "updated_at": "2026-08-26T00:00:00Z"
    })

sql_lines.append(',\n'.join(values_list) + ';')

with open('supabase/migrations/002_import_msds_list.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

with open('lib/data/msds_data.json', 'w', encoding='utf-8') as f:
    json.dump(json_records, f, ensure_ascii=False, indent=2)

print(f'Successfully generated {len(values_list)} records in SQL & JSON!')
