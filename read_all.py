import pandas as pd
files = ['officers','cases','charges','arrests','convictions','evidence','wanted','users','warrants']
for f in files:
    df = pd.read_excel(f'model/data/{f}.xlsx')
    print(f'{f} ({len(df)}): {df.columns.tolist()}')
    print()
