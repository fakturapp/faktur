import { test } from '@japa/runner'
import zeroAccessCryptoService from '#services/crypto/zero_access_crypto_service'
import teamEncryptionService from '#services/crypto/team_encryption_service'
import type Team from '#models/team/team'
import type TeamMember from '#models/team/team_member'

function fakeTeam(mode: 'private' | 'standard'): Team {
  return { encryptionMode: mode } as unknown as Team
}

function fakeMember(encryptedTeamDek: string | null): Pick<TeamMember, 'encryptedTeamDek'> {
  return { encryptedTeamDek }
}

test.group('teamEncryptionService.wrapDekForTeam + unwrapDekForMembership', () => {
  test('private mode round-trip uses user KEK', ({ assert }) => {
    const dek = zeroAccessCryptoService.generateDEK()
    const kek = zeroAccessCryptoService.generateDEK()
    const team = fakeTeam('private')

    const wrap = teamEncryptionService.wrapDekForTeam(team, dek, { userKek: kek })
    assert.match(wrap, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

    const unwrapped = teamEncryptionService.unwrapDekForMembership(team, fakeMember(wrap), {
      userKek: kek,
    })
    assert.isNotNull(unwrapped)
    assert.equal(unwrapped!.toString('hex'), dek.toString('hex'))
  })

  test('standard mode round-trip uses server key (EncryptionService)', ({ assert }) => {
    const dek = zeroAccessCryptoService.generateDEK()
    const team = fakeTeam('standard')

    const wrap = teamEncryptionService.wrapDekForTeam(team, dek)
    assert.match(wrap, /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)

    const unwrapped = teamEncryptionService.unwrapDekForMembership(team, fakeMember(wrap))
    assert.isNotNull(unwrapped)
    assert.equal(unwrapped!.toString('hex'), dek.toString('hex'))
  })

  test('private mode requires userKek to wrap', ({ assert }) => {
    const dek = zeroAccessCryptoService.generateDEK()
    const team = fakeTeam('private')
    assert.throws(() => teamEncryptionService.wrapDekForTeam(team, dek), /userKek/)
  })

  test('cross-mode unwrap returns null instead of throwing', ({ assert }) => {
    const dek = zeroAccessCryptoService.generateDEK()
    const kek = zeroAccessCryptoService.generateDEK()
    const privateTeam = fakeTeam('private')
    const standardTeam = fakeTeam('standard')

    const privateWrap = teamEncryptionService.wrapDekForTeam(privateTeam, dek, { userKek: kek })
    // Try to unwrap a private-mode wrap as if it were standard mode (will fail decrypt)
    const result = teamEncryptionService.unwrapDekForMembership(
      standardTeam,
      fakeMember(privateWrap)
    )
    assert.isNull(result)
  })

  test('requiresUserKek is true only in private mode', ({ assert }) => {
    assert.isTrue(teamEncryptionService.requiresUserKek(fakeTeam('private')))
    assert.isFalse(teamEncryptionService.requiresUserKek(fakeTeam('standard')))
  })

  test('returns null when membership has no wrap', ({ assert }) => {
    const team = fakeTeam('standard')
    const result = teamEncryptionService.unwrapDekForMembership(team, fakeMember(null))
    assert.isNull(result)
  })
})
