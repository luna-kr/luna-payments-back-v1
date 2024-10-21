import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as Express from 'express'
import { getDatabaseClient } from 'src/resource/database/main'
import { Exception } from 'src/resource/plugin/error.plugin'
import tokenPlugin from 'src/resource/plugin/token.plugin'
import userPlugin from 'src/resource/plugin/user.plugin'
import utilityPlugin from 'src/resource/plugin/utility.plugin'
import { EntityManager } from 'typeorm'

@Controller()
export class UserController {
  constructor (
  ) {  }

  
  @Get('v0/userinfo')
  async userinfo (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
    try {
      const _sessionToken = await tokenPlugin.Session.getSummary(utilityPlugin.tokenParser(_authorization))
      if(_sessionToken.success == false) return _next(new Exception(_request, 'Failed to load session token.', HttpStatus.FORBIDDEN, _sessionToken.error))

      if(typeof _sessionToken.userId !== 'string') return _next(new Exception(_request, 'Not authenticated.', HttpStatus.UNAUTHORIZED))

      const _userinfo = await userPlugin.User.search(_sessionToken.userId)
      if(_userinfo.success == false) return _next(new Exception(_request, 'Failed to fetch user data.', HttpStatus.INTERNAL_SERVER_ERROR, _userinfo.error))

      return _response.status(200).json({ success: true, data: {
        id: _userinfo.id,

        full_name: _userinfo.fullName,
        nickname: _userinfo.nickname,
        username: _userinfo.username,

        phone_number: _userinfo.phoneNumber,
        email_address: _userinfo.emailAddress
      }, error: null, requested_at: new Date().toISOString() })
    } catch(_error) { console.log(_error); return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
  }
}
