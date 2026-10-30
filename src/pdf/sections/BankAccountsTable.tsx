export type BankAccountsTableProps = {
  heading: string
  headings: {
    bank: string
    branch: string
    accountNumber: string
    swift: string
    iban: string
    currency: string
  }
  banks: {
    bank: string
    branch: string
    accountNumber: string
    swift: string
    iban: string
    currency: string
  }[]
  /** Writes the currency in the language of the document. */
  formatCurrency: (currency: string) => string
}

/** Bank details block, always printed under the delivery schedule. */
export default function BankAccountsTable({
  heading,
  headings,
  banks,
  formatCurrency,
}: BankAccountsTableProps) {
  return (
    <section className="doc-section">
      <h3>{heading}</h3>
      <table className="doc-table doc-banks">
        <thead>
          <tr>
            <th scope="col">{headings.bank}</th>
            <th scope="col">{headings.branch}</th>
            <th scope="col">{headings.accountNumber}</th>
            <th scope="col">{headings.swift}</th>
            <th scope="col">{headings.iban}</th>
            <th scope="col">{headings.currency}</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((account) => (
            <tr key={`${account.bank}-${account.accountNumber}`}>
              <td>
                <span className="doc-ltr">{account.bank}</span>
              </td>
              <td>
                <span className="doc-ltr">{account.branch}</span>
              </td>
              <td>
                <span className="doc-ltr">{account.accountNumber}</span>
              </td>
              <td>
                <span className="doc-ltr">{account.swift}</span>
              </td>
              <td className="doc-wrap">
                <span className="doc-ltr">{account.iban}</span>
              </td>
              <td>{formatCurrency(account.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
