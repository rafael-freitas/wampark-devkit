import path from 'path'

export default async function importApi (pathname) {
  const { default: api } = await import(path.resolve(path.join(pathname)))
  return api
}