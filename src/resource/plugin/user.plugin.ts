import axios from 'axios'
import { Token, TokenMethod, TokenStatus } from '../database/entity/Token.entity'
import { getDatabaseClient } from '../database/main'
import utilityPlugin from './utility.plugin'
import tokenPlugin from './token.plugin'
import CryptoJS from 'crypto-js'
import dayjs from 'dayjs'
import { User, UserStatus } from '../database/entity/User.entity'
import { ArrayContains } from 'typeorm'
import { Permission } from '../database/entity/Permission.entity'
import { Exception } from './error.plugin'

export default {
    pluginName: 'userPlugin',


    User: {
        search: async (_uuid: string & { __brand: 'UUID' }): Promise<
            {
                success: true,
                id: string & { __brand: 'UUID' },
                username: string,
                fullName: string,
                nickname: string,
                birthday: string,
                gender: 'Male' | 'Female',
                emailAddress: string,
                phoneNumber: string,
                status: 'Pending' | 'Normal' | 'Suspended',

                permissions: Array<{ id: string & { __brand: 'UUID' }, name: string, isManager: boolean, isDefault: boolean }>,

                suspend: () => Promise<{ success: true } | { success: false, error?: Error }>,
                unsuspend: () => Promise<{ success: true } | { success: false, error?: Error }>
            }
            | { success: false, error?: Error }
        > => {
            try {
                const _users = await getDatabaseClient().manager.getRepository(User).find({ where: { uuid: _uuid, is_active: true } })
                if(_users.length !== 1) return { success: false, error: new Error('Wrong user id.') }

                const _permissions = await Promise.all(_users[0].permission.map(async _permission => {
                    const _permissions = await getDatabaseClient().manager.getRepository(Permission).find({ where: { uuid: _permission, is_active: true } })
                    if(_permissions.length !== 1) return new Error('Wrong permission id.')
                    return { id: _permissions[0].uuid, name: _permissions[0].name, isManager: _permissions[0].is_manager, isDefault: _permissions[0].is_default }
                }))
                for(const _permission of _permissions) {
                    if(_permission instanceof Error) return { success: false, error: new Error('Failed to fetch permission.', { cause: _permission }) }
                }

                return {
                    success: true,
                    id: _users[0].uuid,
                    username: _users[0].username,
                    fullName: _users[0].full_name,
                    nickname: _users[0].nickname,
                    birthday: _users[0].birthday,
                    gender: _users[0].gender,
                    emailAddress: _users[0].email_address,
                    phoneNumber: _users[0].phone_number,
                    status: _users[0].status,

                    permissions: _permissions as Array<{ id: string & { __brand: 'UUID' }, name: string, isManager: boolean, isDefault: boolean }>,

                    suspend: async () => {
                        try {
                            if(_users[0].status !== UserStatus.Normal) return { success: false, error: new Error('Invalid user status.') }
                            await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid, is_active: true }, { status: UserStatus.Suspended })
                            return { success: true }
                        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                    },
                    unsuspend: async () => {
                        try {
                            if(_users[0].status !== UserStatus.Suspended) return { success: false, error: new Error('Invalid user status.') }
                            await getDatabaseClient().manager.getRepository(User).update({ uuid: _users[0].uuid, is_active: true }, { status: UserStatus.Normal })
                            return { success: true }
                        } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
                    }
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    },
    oAuth: {
        getUser: async (_accessToken: { tokenType: 'Bearer' | 'Basic', accessToken: string & { __brand: 'TOKEN' } }): Promise<
            { success: true, id: string, username?: string, profile?: { firstName: string, lastName: string, nickname: string }, birthday?: Date, gender?: 'male' | 'female', emails?: Array<{ id: string, emailAddress: string, isVerified: boolean, addedDate: Date }>, phones?: Array<{ id: string, phoneNumber: string, isVerified: boolean, addedDate: Date }> }
            | { success: false, error?: Error }
        > => {
            try {
                const _appToken = await tokenPlugin.Authorization.getAppToken()
                if(_appToken.success == false) return { success: false, error: new Error('Failed to issue App token.', { cause: _appToken.error }) }
                const _result = await axios.get(`${ process.env.LUNA_ACCOUNTS_API_ENDPOINT }/oauth2/userinfo`, { headers: { 'x-apptoken': `${ _appToken.token.tokenType } ${ _appToken.token.token }`, authorization: `${ _accessToken.tokenType } ${ _accessToken.accessToken }` } })
                if(_result.status !== 200) return { success: false, error: new Error('Failed to fetch user data.') }
                return {
                    success: true,
                    id: _result.data.id,
                    username: _result.data.username ? _result.data.username : undefined,
                    profile: _result.data.profile ? {
                        firstName: _result.data.profile.first_name,
                        lastName: _result.data.profile.last_name,
                        nickname: _result.data.profile.nickname
                    } : undefined,
                    birthday: _result.data.birthday ? _result.data.birthday : undefined,
                    gender: _result.data.gender ? _result.data.gender : undefined,
                    emails: _result.data.emails ? _result.data.emails.map(_email => { return {
                        id: _email.id,
                        emailAddress: _email.email_address,
                        isVerified: _email.is_verified,
                        addedDate: new Date(_email.added_at)
                    } }) : undefined,
                    phones: _result.data.emails ? _result.data.phones.map(_phone => { return {
                        id: _phone.id,
                        phoneNumber: _phone.phone_number,
                        isVerified: _phone.is_verified,
                        addedDate: new Date(_phone.added_at)
                    } }) : undefined
                }
            } catch(_error) { return _error instanceof Error ? { success: false, error: new Error('An unknown error has occured', { cause: _error }) } : (typeof _error == 'string' ? { success: false, error: new Error(_error) } : { success: false, error: new Error('An unknown error has occured.') }) }
        }
    }
}