import { Options, ColumnOption } from "./index.js";

/**
 * Chunks accepted by the writable side: bytes as produced natively by
 * `fetch().body`, or strings as emitted by `TextDecoderStream`.
 */
export type Input = Buffer | Uint8Array | string;

/**
 * Record type produced from a `columns` option. Named column definitions
 * (`{name: "x"}` or `"x"`) become keys, disabled entries
 * (`undefined`, `null`, `false`) are skipped.
 */
export type OutputFromColumns<C> = C extends readonly ColumnOption[]
  ? {
      [K in C[number] as K extends { name: infer N extends string }
        ? N
        : K extends string
          ? K
          : never]: string;
    }
  : Record<string, string>;

declare function parse<const C>(
  options: Omit<Options, "columns"> & {
    columns: C;
  },
): TransformStream<
  Input,
  C extends false | undefined
    ? string[]
    : C extends readonly ColumnOption[]
      ? OutputFromColumns<C>
      : Record<string, string>
>;
declare function parse(
  options?: Options,
): TransformStream<Input, string[]>;

export { parse };

export {
  CastingContext, // Deprecated
  CastingFunction,
  CastingDateFunction,
  ColumnOption,
  Options,
  OptionsNormalized,
  OptionsWithColumns,
  Info,
  InfoCallback,
  InfoDataSet,
  InfoRecord,
  InfoField,
  CsvErrorCode,
  CsvError,
  normalize_options,
} from "./index.js";
