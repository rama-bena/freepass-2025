import { expect, jest } from '@jest/globals';
import mockingoose from 'mockingoose';
import { registerUser } from '../src/controllers/userController';
import User from '../src/models/userModel';
import { HttpStatusCode, ResponseError } from '../src/utils/types';

describe('registerUser POST /user/register', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should register a new user successfully', async () => {
    mockingoose(User).toReturn(null, 'findOne');
    mockingoose(User).toReturn(
      {
        _id: 'userId',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      },
      'save'
    );

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        // _id: expect.any(String),
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      })
    );
  });

  it('should return conflict if user already exists', async () => {
    mockingoose(User).toReturn({ email: 'test@example.com' }, 'findOne');

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CONFLICT);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.CONFLICT,
      message: expect.any(String),
    });
  });

  it('should handle errors during registration', async () => {
    mockingoose(User).toReturn(new Error('Database error'), 'findOne');

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: expect.any(String),
    });
  });
});
