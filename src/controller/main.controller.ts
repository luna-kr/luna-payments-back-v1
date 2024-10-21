import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Request, Response, Headers, Next, HttpStatus, Ip } from '@nestjs/common'
import { AppService } from '../service/app.service'
import Express, { NextFunction } from 'express'
import { Exception } from 'src/resource/plugin/error.plugin'

@Controller()
export class AppController {
  constructor (private readonly _appService: AppService) {

  }

  @Get('/')
  async createPayment (@Request() _request: Express.Request, @Response() _response: Express.Response, @Headers('authorization') _authorization: string, @Next() _next: Express.NextFunction) {
    try {
      return _response.status(200).json({ success: true, data: null, error: null, requested_at: new Date().toISOString() })

    } catch(_error) { return _next(new Exception(_request, 'An unknown error has occured.', HttpStatus.INTERNAL_SERVER_ERROR, _error)) }
}
}
