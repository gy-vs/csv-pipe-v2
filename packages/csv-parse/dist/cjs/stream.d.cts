import { Options, OptionsWithColumns } from "./index.cjs";

// Web Streams emit records in object mode. Without `columns`, records are
// arrays of strings. With `columns`, records are objects whose keys are the
// column names.
declare function parse(options?: Options): TransformStream<
  Buffer | Uint8Array | string,
  string[]
>;
declare function parse<T = unknown, U = T>(
  options: OptionsWithColumns<T, U>,
): TransformStream<Buffer | Uint8Array | string, T>;

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
} from "./index.cjs";
