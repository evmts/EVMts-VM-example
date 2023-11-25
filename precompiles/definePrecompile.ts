import { Address } from '@ethereumjs/util'
import { type EvmtsContract } from '@evmts/core'
import { decodeFunctionData, encodeFunctionResult, hexToBytes, toHex, type Hex } from 'viem'
import { Abi, AbiParametersToPrimitiveTypes, ExtractAbiFunction, ExtractAbiFunctionNames } from 'abitype'

type Handler<TAbi extends Abi, TFunctionName extends ExtractAbiFunctionNames<TAbi>> = ((params: {
  gasLimit: bigint
  args: AbiParametersToPrimitiveTypes<
    ExtractAbiFunction<TAbi, TFunctionName>['inputs']
  >
}) => Promise<{
  executionGasUsed: bigint,
  returnValue: AbiParametersToPrimitiveTypes<ExtractAbiFunction<TAbi, TFunctionName>['outputs']>[0],
  // TODO expose the ability to emit logs from precompiles
  // logs: ExtractEvetLogs<TAbi, TFunctionName>
  // TODO add ability to return revert errors
}>)

export const defineCall = <TAbi extends Abi>(
  abi: TAbi,
  handlers: { [TFunctionName in ExtractAbiFunctionNames<TAbi>]: Handler<TAbi, TFunctionName> }
) => {
  return async ({ data, gasLimit }: { data: `0x${string}`, gasLimit: bigint }) => {
    const d = decodeFunctionData({
      abi: abi,
      data: data,
    })
    const handler = handlers[d.functionName]
    try {
      const { returnValue, executionGasUsed } = await handler({
        gasLimit: gasLimit,
        args: d.args as any,
      })
      return {
        executionGasUsed,
        returnValue: hexToBytes(encodeFunctionResult({
          abi: abi,
          functionName: d.functionName as any,
          result: returnValue as any
        }))
      }
    } catch (e) {
      // TODO return an error instead of throwing
      throw e
    }
  }
}

export abstract class Precompile<TName extends string, THumanReadableAbi extends readonly string[], TBytecode extends `0x${string}` | undefined, TDeployedBytecode extends `0x${string}` | undefined>{
  public abstract readonly contract: EvmtsContract<TName, THumanReadableAbi, TBytecode, TDeployedBytecode>
  public abstract readonly address: `0x${string}`
  protected readonly ethjsAddress = () => Address.fromString(this.address)
  public readonly precompile = () => ({
    address: this.ethjsAddress(),
    function: (params: { data: Uint8Array, gasLimit: bigint }) => {
      return this.call({ data: toHex(params.data), gasLimit: params.gasLimit })
    }
  })
  public abstract readonly call: (context: { data: Hex, gasLimit: bigint }) => Promise<{ returnValue: Uint8Array, executionGasUsed: bigint }>
}

export const definePrecompile = <TName extends string, THumanReadableAbi extends readonly string[], TBytecode extends `0x${string}` | undefined, TDeployedBytecode extends `0x${string}` | undefined>(
  { contract, address, call }: Pick<Precompile<TName, THumanReadableAbi, TBytecode, TDeployedBytecode>, 'contract' | 'address' | 'call'>
): Precompile<TName, THumanReadableAbi, TBytecode, TDeployedBytecode> => {
  class PrecompileImplementation extends Precompile<TName, THumanReadableAbi, TBytecode, TDeployedBytecode> {
    contract = contract
    address = address
    call = call
  }
  return new PrecompileImplementation()
}

