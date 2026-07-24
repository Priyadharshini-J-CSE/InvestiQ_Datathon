import pandas as pd, sys
files = ['fir','criminals','persons','officers','cases','charges','arrests','convictions','evidence','wanted','users','warrants']
for f in files:
    df = pd.read_excel(f'model/data/{f}.xlsx')
    print(f'=== {f} ({len(df)}) ===')
    print('COLS:', df.columns.tolist())
    print('ROW0:', df.head(1).to_dict(orient='records'))
    print()
sys.stdout.flush()
