// Expose `id` instead of `_id`/`__v` in JSON responses
export function toJSONPlugin(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => { ret.id = String(ret._id); delete ret._id; return ret },
  })
}
