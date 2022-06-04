import {assert, expect, test} from 'vitest'
import { isValidIp } from '../../models/network/components/Adressable'


test('isValidIp()', () => {
  expect(isValidIp("122")).toBe(false)
  expect(isValidIp("122.13.154.255")).toBe(true)
  expect(isValidIp("122.256.154.255")).toBe(false)
  expect(isValidIp("122.13.154.255.1")).toBe(false)
  expect(isValidIp("122.13.154.a")).toBe(false)
})