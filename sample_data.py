import pandas as pd
for f in ['fir','criminals','persons','officers','cases','charges','arrests','convictions','evidence','wanted','users','warrants']:
    df = pd.read_excel(f'model/data/{f}.xlsx')
    print(f'=== {f} ({len(df)} rows) ===')
    print(df.head(2).to_string())
    print()
