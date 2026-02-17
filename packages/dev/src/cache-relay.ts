// ---------------------------------------------------------------------------
// CacheRelay — full Redis abstraction over ioredis
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClient = any

// ---- Namespace interfaces --------------------------------------------------

export interface StringOps {
	get(key: string): Promise<string | null>
	set(key: string, value: string, ttlSeconds?: number): Promise<void>
	mget(...keys: string[]): Promise<(string | null)[]>
	mset(pairs: Record<string, string>): Promise<void>
	incr(key: string): Promise<number>
	incrby(key: string, increment: number): Promise<number>
	decr(key: string): Promise<number>
	decrby(key: string, decrement: number): Promise<number>
	append(key: string, value: string): Promise<number>
	strlen(key: string): Promise<number>
}

export interface HashOps {
	get(key: string, field: string): Promise<string | null>
	set(key: string, field: string, value: string): Promise<void>
	getAll(key: string): Promise<Record<string, string>>
	del(key: string, ...fields: string[]): Promise<number>
	exists(key: string, field: string): Promise<boolean>
	keys(key: string): Promise<string[]>
	vals(key: string): Promise<string[]>
	len(key: string): Promise<number>
	mset(key: string, pairs: Record<string, string>): Promise<void>
	mget(key: string, ...fields: string[]): Promise<(string | null)[]>
	incrby(key: string, field: string, increment: number): Promise<number>
}

export interface ListOps {
	push(key: string, ...values: string[]): Promise<number>
	lpush(key: string, ...values: string[]): Promise<number>
	pop(key: string): Promise<string | null>
	lpop(key: string): Promise<string | null>
	range(key: string, start: number, stop: number): Promise<string[]>
	len(key: string): Promise<number>
	trim(key: string, start: number, stop: number): Promise<void>
	index(key: string, index: number): Promise<string | null>
	set(key: string, index: number, value: string): Promise<void>
	rem(key: string, count: number, value: string): Promise<number>
}

export interface SetOps {
	add(key: string, ...members: string[]): Promise<number>
	rem(key: string, ...members: string[]): Promise<number>
	members(key: string): Promise<string[]>
	isMember(key: string, member: string): Promise<boolean>
	card(key: string): Promise<number>
	union(...keys: string[]): Promise<string[]>
	inter(...keys: string[]): Promise<string[]>
	diff(...keys: string[]): Promise<string[]>
}

export interface SortedSetOps {
	add(key: string, score: number, member: string): Promise<number>
	rem(key: string, ...members: string[]): Promise<number>
	range(key: string, start: number, stop: number): Promise<string[]>
	rangeWithScores(key: string, start: number, stop: number): Promise<{ member: string; score: number }[]>
	rangeByScore(key: string, min: number | string, max: number | string): Promise<string[]>
	revRange(key: string, start: number, stop: number): Promise<string[]>
	score(key: string, member: string): Promise<number | null>
	rank(key: string, member: string): Promise<number | null>
	card(key: string): Promise<number>
	incrby(key: string, increment: number, member: string): Promise<number>
	remRangeByRank(key: string, start: number, stop: number): Promise<number>
	remRangeByScore(key: string, min: number | string, max: number | string): Promise<number>
}

export interface KeyOps {
	exists(...keys: string[]): Promise<number>
	expire(key: string, seconds: number): Promise<boolean>
	ttl(key: string): Promise<number>
	pttl(key: string): Promise<number>
	persist(key: string): Promise<boolean>
	rename(key: string, newKey: string): Promise<void>
	type(key: string): Promise<string>
	scan(cursor: number, options?: { match?: string; count?: number }): Promise<{ cursor: number; keys: string[] }>
}

export interface PubSubOps {
	publish(channel: string, message: string): Promise<number>
	subscribe(channel: string, callback: (message: string, channel: string) => void): Promise<void>
	unsubscribe(channel: string): Promise<void>
}

export interface TransactionOps {
	multi(): RedisClient
	exec(pipeline: RedisClient): Promise<unknown[]>
}

export interface ScriptOps {
	eval(script: string, keys: string[], args: string[]): Promise<unknown>
	evalsha(sha: string, keys: string[], args: string[]): Promise<unknown>
}

export interface GeoOps {
	add(key: string, longitude: number, latitude: number, member: string): Promise<number>
	pos(key: string, ...members: string[]): Promise<([number, number] | null)[]>
	dist(key: string, member1: string, member2: string, unit?: string): Promise<string | null>
	radius(key: string, longitude: number, latitude: number, radius: number, unit: string): Promise<string[]>
}

export interface HyperLogLogOps {
	add(key: string, ...elements: string[]): Promise<number>
	count(...keys: string[]): Promise<number>
	merge(destKey: string, ...sourceKeys: string[]): Promise<void>
}

export interface BitmapOps {
	setbit(key: string, offset: number, value: 0 | 1): Promise<number>
	getbit(key: string, offset: number): Promise<number>
	count(key: string, start?: number, end?: number): Promise<number>
	op(operation: 'AND' | 'OR' | 'XOR' | 'NOT', destKey: string, ...keys: string[]): Promise<number>
}

export interface StreamOps {
	add(key: string, id: string, fields: Record<string, string>): Promise<string>
	read(key: string, id: string, count?: number): Promise<unknown[]>
	len(key: string): Promise<number>
	range(key: string, start: string, end: string, count?: number): Promise<unknown[]>
	trim(key: string, maxLen: number): Promise<number>
}

// ---- CacheRelay type -------------------------------------------------------

export interface CacheRelay {
	/** Get a raw string value */
	get(key: string): Promise<string | null>
	/** Get and JSON-parse a value */
	gett<T = unknown>(key: string): Promise<T | null>
	/** Set a value (objects are JSON-stringified) */
	set(key: string, value: unknown, options?: { ttlSeconds?: number }): Promise<void>
	/** Delete one or more keys */
	del(...keys: string[]): Promise<number>

	/** Raw ioredis client for advanced usage */
	raw: RedisClient

	strings: StringOps
	hashes: HashOps
	lists: ListOps
	sets: SetOps
	sortedSets: SortedSetOps
	keys: KeyOps
	pubsub: PubSubOps
	transactions: TransactionOps
	scripts: ScriptOps
	geo: GeoOps
	hyperloglog: HyperLogLogOps
	bitmaps: BitmapOps
	streams: StreamOps
}

// ---- Singleton state -------------------------------------------------------

let _cacheRelay: CacheRelay | undefined
let _currentConnectionString: string | undefined

// ---- Builder ---------------------------------------------------------------

function buildCacheRelay(redis: RedisClient): CacheRelay {
	const relay: CacheRelay = {
		raw: redis,

		// -- Top-level convenience ------------------------------------------------

		async get(key: string) {
			return redis.get(key)
		},

		async gett<T = unknown>(key: string): Promise<T | null> {
			const raw = await redis.get(key)
			if (raw === null || raw === undefined) return null
			try {
				return JSON.parse(raw) as T
			} catch {
				return null
			}
		},

		async set(key: string, value: unknown, options?: { ttlSeconds?: number }) {
			const serialized = typeof value === 'string' ? value : JSON.stringify(value)
			if (options?.ttlSeconds) {
				await redis.set(key, serialized, 'EX', options.ttlSeconds)
			} else {
				await redis.set(key, serialized)
			}
		},

		async del(...keys: string[]) {
			if (keys.length === 0) return 0
			return redis.del(...keys)
		},

		// -- Strings --------------------------------------------------------------

		strings: {
			get: (key) => redis.get(key),
			async set(key, value, ttlSeconds?) {
				if (ttlSeconds) {
					await redis.set(key, value, 'EX', ttlSeconds)
				} else {
					await redis.set(key, value)
				}
			},
			mget: (...keys) => redis.mget(...keys),
			async mset(pairs) {
				const args: string[] = []
				for (const [k, v] of Object.entries(pairs)) {
					args.push(k, v)
				}
				await redis.mset(...args)
			},
			incr: (key) => redis.incr(key),
			incrby: (key, inc) => redis.incrby(key, inc),
			decr: (key) => redis.decr(key),
			decrby: (key, dec) => redis.decrby(key, dec),
			append: (key, value) => redis.append(key, value),
			strlen: (key) => redis.strlen(key),
		},

		// -- Hashes ---------------------------------------------------------------

		hashes: {
			get: (key, field) => redis.hget(key, field),
			async set(key, field, value) {
				await redis.hset(key, field, value)
			},
			async getAll(key) {
				return redis.hgetall(key)
			},
			del: (key, ...fields) => redis.hdel(key, ...fields),
			async exists(key, field) {
				return (await redis.hexists(key, field)) === 1
			},
			keys: (key) => redis.hkeys(key),
			vals: (key) => redis.hvals(key),
			len: (key) => redis.hlen(key),
			async mset(key, pairs) {
				const args: string[] = []
				for (const [f, v] of Object.entries(pairs)) {
					args.push(f, v)
				}
				await redis.hmset(key, ...args)
			},
			mget: (key, ...fields) => redis.hmget(key, ...fields),
			incrby: (key, field, inc) => redis.hincrby(key, field, inc),
		},

		// -- Lists ----------------------------------------------------------------

		lists: {
			push: (key, ...values) => redis.rpush(key, ...values),
			lpush: (key, ...values) => redis.lpush(key, ...values),
			pop: (key) => redis.rpop(key),
			lpop: (key) => redis.lpop(key),
			range: (key, start, stop) => redis.lrange(key, start, stop),
			len: (key) => redis.llen(key),
			async trim(key, start, stop) {
				await redis.ltrim(key, start, stop)
			},
			index: (key, idx) => redis.lindex(key, idx),
			async set(key, idx, value) {
				await redis.lset(key, idx, value)
			},
			rem: (key, count, value) => redis.lrem(key, count, value),
		},

		// -- Sets -----------------------------------------------------------------

		sets: {
			add: (key, ...members) => redis.sadd(key, ...members),
			rem: (key, ...members) => redis.srem(key, ...members),
			members: (key) => redis.smembers(key),
			async isMember(key, member) {
				return (await redis.sismember(key, member)) === 1
			},
			card: (key) => redis.scard(key),
			union: (...keys) => redis.sunion(...keys),
			inter: (...keys) => redis.sinter(...keys),
			diff: (...keys) => redis.sdiff(...keys),
		},

		// -- Sorted Sets ----------------------------------------------------------

		sortedSets: {
			add: (key, score, member) => redis.zadd(key, score, member),
			rem: (key, ...members) => redis.zrem(key, ...members),
			range: (key, start, stop) => redis.zrange(key, start, stop),
			async rangeWithScores(key, start, stop) {
				const raw: string[] = await redis.zrange(key, start, stop, 'WITHSCORES')
				const result: { member: string; score: number }[] = []
				for (let i = 0; i < raw.length; i += 2) {
					result.push({ member: raw[i], score: parseFloat(raw[i + 1]) })
				}
				return result
			},
			rangeByScore: (key, min, max) => redis.zrangebyscore(key, min, max),
			revRange: (key, start, stop) => redis.zrevrange(key, start, stop),
			async score(key, member) {
				const s = await redis.zscore(key, member)
				return s === null ? null : parseFloat(s)
			},
			rank: (key, member) => redis.zrank(key, member),
			card: (key) => redis.zcard(key),
			incrby: (key, inc, member) => redis.zincrby(key, inc, member),
			remRangeByRank: (key, start, stop) => redis.zremrangebyrank(key, start, stop),
			remRangeByScore: (key, min, max) => redis.zremrangebyscore(key, min, max),
		},

		// -- Keys -----------------------------------------------------------------

		keys: {
			exists: (...keys) => redis.exists(...keys),
			async expire(key, seconds) {
				return (await redis.expire(key, seconds)) === 1
			},
			ttl: (key) => redis.ttl(key),
			pttl: (key) => redis.pttl(key),
			async persist(key) {
				return (await redis.persist(key)) === 1
			},
			async rename(key, newKey) {
				await redis.rename(key, newKey)
			},
			type: (key) => redis.type(key),
			async scan(cursor, options?) {
				const args: (string | number)[] = [cursor]
				if (options?.match) args.push('MATCH', options.match)
				if (options?.count) args.push('COUNT', options.count)
				const [nextCursor, keys] = await redis.scan(...args)
				return { cursor: parseInt(nextCursor, 10), keys }
			},
		},

		// -- Pub/Sub --------------------------------------------------------------

		pubsub: {
			publish: (channel, message) => redis.publish(channel, message),
			async subscribe(channel, callback) {
				const sub = redis.duplicate()
				await sub.subscribe(channel)
				sub.on('message', (ch: string, msg: string) => {
					if (ch === channel) callback(msg, ch)
				})
			},
			async unsubscribe(channel) {
				await redis.unsubscribe(channel)
			},
		},

		// -- Transactions ---------------------------------------------------------

		transactions: {
			multi() {
				return redis.multi()
			},
			async exec(pipeline) {
				return pipeline.exec()
			},
		},

		// -- Scripts --------------------------------------------------------------

		scripts: {
			eval: (script, keys, args) =>
				redis.eval(script, keys.length, ...keys, ...args),
			evalsha: (sha, keys, args) =>
				redis.evalsha(sha, keys.length, ...keys, ...args),
		},

		// -- Geo ------------------------------------------------------------------

		geo: {
			add: (key, lon, lat, member) => redis.geoadd(key, lon, lat, member),
			pos: (key, ...members) => redis.geopos(key, ...members),
			dist: (key, m1, m2, unit?) => {
				if (unit) return redis.geodist(key, m1, m2, unit)
				return redis.geodist(key, m1, m2)
			},
			radius: (key, lon, lat, r, unit) =>
				redis.georadius(key, lon, lat, r, unit),
		},

		// -- HyperLogLog ----------------------------------------------------------

		hyperloglog: {
			add: (key, ...elements) => redis.pfadd(key, ...elements),
			count: (...keys) => redis.pfcount(...keys),
			async merge(destKey, ...sourceKeys) {
				await redis.pfmerge(destKey, ...sourceKeys)
			},
		},

		// -- Bitmaps --------------------------------------------------------------

		bitmaps: {
			setbit: (key, offset, value) => redis.setbit(key, offset, value),
			getbit: (key, offset) => redis.getbit(key, offset),
			count(key, start?, end?) {
				if (start !== undefined && end !== undefined) {
					return redis.bitcount(key, start, end)
				}
				return redis.bitcount(key)
			},
			op: (operation, destKey, ...keys) =>
				redis.bitop(operation, destKey, ...keys),
		},

		// -- Streams --------------------------------------------------------------

		streams: {
			add(key, id, fields) {
				const args: string[] = []
				for (const [f, v] of Object.entries(fields)) {
					args.push(f, v)
				}
				return redis.xadd(key, id, ...args)
			},
			read(key, id, count?) {
				if (count) return redis.xread('COUNT', count, 'STREAMS', key, id)
				return redis.xread('STREAMS', key, id)
			},
			len: (key) => redis.xlen(key),
			range(key, start, end, count?) {
				if (count) return redis.xrange(key, start, end, 'COUNT', count)
				return redis.xrange(key, start, end)
			},
			trim: (key, maxLen) => redis.xtrim(key, 'MAXLEN', maxLen),
		},
	}

	return relay
}

// ---- Public API ------------------------------------------------------------

/**
 * Initialize (or reinitialize) the CacheRelay singleton.
 *
 * @param connectionString — `host:port` (default `localhost:6379`)
 * @returns the CacheRelay instance
 *
 * Only creates a new Redis connection when the connection string changes.
 * Requires `ioredis` as a peer dependency — throws a clear error if missing.
 */
export function initCacheRelay(connectionString?: string): CacheRelay {
	const raw = connectionString ?? 'localhost:6379'

	// Normalize: bare hostname (no port) → hostname:6379
	const connStr = raw.includes(':') ? raw : `${raw}:6379`

	// Reuse existing instance when the connection string hasn't changed
	if (_cacheRelay && _currentConnectionString === connStr) return _cacheRelay

	// Dynamic require — gives a clear error when ioredis isn't installed
	let Redis: new (port: number, host: string) => RedisClient
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		Redis = require('ioredis')
	} catch {
		throw new Error(
			'CacheRelay requires "ioredis" as a peer dependency. Install it with: npm install ioredis'
		)
	}

	const [host, portStr] = connStr.split(':')
	const port = parseInt(portStr ?? '6379', 10)

	const redis = new Redis(port, host || 'localhost')
	_cacheRelay = buildCacheRelay(redis)
	_currentConnectionString = connStr
	return _cacheRelay
}

/**
 * Get the current CacheRelay singleton.
 * Lazily initializes with default settings (`localhost:6379`) if not yet created.
 */
export function getCacheRelay(): CacheRelay {
	if (!_cacheRelay) return initCacheRelay()
	return _cacheRelay
}
