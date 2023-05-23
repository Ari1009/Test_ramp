import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { InputSelect } from "./components/InputSelect"
import { Instructions } from "./components/Instructions"
import { Transactions } from "./components/Transactions"
import { useEmployees } from "./hooks/useEmployees"
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions"
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee"
import { EMPTY_EMPLOYEE } from "./utils/constants"
import { Employee } from "./utils/types"

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees()
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions()
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee()
  const [isLoading, setIsLoading] = useState(false)
  // BUG6: part2 added variable to track whether the transactions are filtered by employee or not. This is used to conditionally render the  button 
  //This value is toggled false in the loadAllTransactions function and toggled true in the loadTransactionsByEmployee function.
  const [isFilteredByEmployee , setIsFilteredByEmployee] = useState(false); 

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  )

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true)
    transactionsByEmployeeUtils.invalidateData()
    setIsFilteredByEmployee(false);

    await employeeUtils.fetchAll()
    //BUG5:  move setIsLoading invocation to before the fetchAll() for paginatedTransactionsUtils
    setIsLoading(false)
    await paginatedTransactionsUtils.fetchAll()

    
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils])

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData()
      setIsFilteredByEmployee(true);
      await transactionsByEmployeeUtils.fetchById(employeeId)
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  )

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions()
    }
  }, [employeeUtils.loading, employees, loadAllTransactions])

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return
            }else if (newValue.id === "") { // BUG3: If the selected newValue is null or the id property of the newValue is an empty string , it will call loadAllTransactions() to load all transactions. This ensures that selecting "All Employees" or an empty value triggers the correct behavior of loading all transactions.
              await loadAllTransactions()
              return
            }else{
              await loadTransactionsByEmployee(newValue.id)

            }
          }}
        />

        <div className="RampBreak--l" />
       
        <div className="RampGrid">
          <Transactions transactions={transactions} />
         {/* BUG6: part 1 To hide the "View more" button when transactions are filtered by an employee,I added a condition to check 
        if transactions are filtered by an employee in the rendering of the button*/}
          {transactions !== null &&
            !isFilteredByEmployee &&
            paginatedTransactions?.nextPage !== null &&(
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions()
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  )
}
