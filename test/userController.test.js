import { expect, jest } from '@jest/globals';
import { registerUser, loginUser } from '../src/controllers/userController';
import User from '../src/models/userModel';
import { HttpStatusCode, ResponseError, Role } from '../src/utils/types';


describe('registerUser POST /user/register', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: Role.USER,
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register a new user successfully', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    jest.spyOn(User.prototype, 'save').mockResolvedValue();

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User.prototype.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CREATED);
    expect(res.json).toHaveBeenCalledWith({
      _id: expect.anything(),
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
    });
  });

  it('should return conflict if user already exists', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ email: req.body.email });

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(HttpStatusCode.CONFLICT);
    expect(res.json).toHaveBeenCalledWith({
      error: ResponseError.CONFLICT,
      message: expect.any(String),
    });
  });

  it('should handle errors during registration', async () => {
    jest.spyOn(User, 'findOne').mockRejectedValue(new Error('Database error'));

    await registerUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: ResponseError.INTERNAL_SERVER_ERROR,
        message: expect.any(String),
      })
    );
  });
});

describe('loginUser POST /user/login', () => {
  let req, res, user;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    user = {
      _id: 'testUserId',
      username: 'testUser',
      email: 'test@example.com',
      role: Role.USER,
      matchPassword: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should login a user when email and password correct', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(user);
    user.matchPassword.mockResolvedValue(true);

    await loginUser(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(user.matchPassword).toHaveBeenCalledWith(req.body.password);
    expect(res.cookie).toHaveBeenCalledWith('token', expect.any(String), expect.any(Object));
    expect(res.json).toHaveBeenCalledWith({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  });
});
