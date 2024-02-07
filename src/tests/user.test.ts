import supertest from 'supertest'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { app } from '../app'
import { User } from '../models/user.model'
import type { UpdateUserForm } from '../types/user.type'
import type { RegisterForm } from '../types/auth.type'

describe('authRoutes', () => {
  beforeAll(async () => {
    const mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoose.connection.close()
  })

  describe('POST /v1/user/:id', () => {
    let token: string
    let newUser: RegisterForm
    let newOtherUser: RegisterForm
    beforeAll(async () => {
      newUser = {
        fullName: 'valid full name',
        username: 'validusername',
        nim: '231502001110111',
        fakultas: 'valid fakultas',
        prodi: 'valid prodi',
        email: 'validemail@gmail.com',
        password: 'validpassword'
      }
      await supertest(app).post('/v1/auth/register').send(newUser)

      const res = await supertest(app)
        .post('/v1/auth/login')
        .send({ username: newUser.username, password: newUser.password })
      token = res.body.data

      newOtherUser = {
        fullName: 'valid full name',
        username: 'othervalidusername',
        nim: '231502001110112',
        fakultas: 'valid fakultas',
        prodi: 'valid prodi',
        email: 'othervalidemail@gmail.com',
        password: 'validpassword'
      }
      await supertest(app).post('/v1/auth/register').send(newOtherUser)
    })

    let request: UpdateUserForm
    beforeEach(() => {
      request = {
        fullName: 'valid new full name',
        nim: '235150200111012',
        fakultas: 'valid new fakultas',
        prodi: 'valid new prodi',
        username: 'validnewusername',
        email: 'validnewemail@gmail.com',
        password: 'validnewpassword'
      }
    })

    test('should return 200 and updated data if request data is ok and correct token', async () => {
      const res = await supertest(app).patch('/v1/user/profile').set('Authorization', `Bearer ${token}`).send(request)
      expect(res.body.status).toBe(200)

      const user = await User.findOne({ username: request.username })
      expect(user?.username).toEqual(request.username)

      expect(res.body.data.username).toEqual(request.username)
    })

    test('should return 403 forbidden if token is wrong or empty', async () => {
      const res = await supertest(app).patch('/v1/user/profile').send(request)
      expect(res.body.status).toBe(403)
    })

    test('should return 400 and if request data is not valid', async () => {
      request.email = 'notvalidemail.com'
      const res = await supertest(app).patch('/v1/user/profile').set('Authorization', `Bearer ${token}`).send(request)
      expect(res.body.status).toBe(400)
    })

    test('should return 400 and if request data is taken', async () => {
      request.email = newOtherUser.email
      const res = await supertest(app).patch('/v1/user/profile').set('Authorization', `Bearer ${token}`).send(request)
      expect(res.body.status).toBe(400)
    })
  })
})