const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getUserId } = require("../utils");
const APP_SECRET = process.env.APP_SECRET;

async function signup(parent, args, context, info) {
  const hashedPassword = await bcrypt.hash(args.password, 10);
  const { password, ...user } = await context.prisma.createUser({
    ...args,
    password: hashedPassword,
  });
  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  return {
    token,
    user,
  };
}

async function login(parent, args, context, info) {
  try {
    const { password, ...user } = await context.prisma.user({
      email: args.email,
    });
    if (user) {
      const valid = await bcrypt.compare(args.password, password);
      if (valid) {
        const token = jwt.sign({ userId: user.id }, APP_SECRET);

        return {
          token,
          user,
        };
      }
    }
  } catch (e) {
    throw new Error("Invalid login credentials");
  }
  throw new Error("Invalid login credentials");
}

function post(parent, { url, description }, context, info) {
  const userId = getUserId(context);
  return context.prisma.createLink({
    url,
    description,
    postedBy: { connect: { id: userId } },
  });
}

async function vote(parent, args, context, info) {
  const userId = getUserId(context);
  const voteExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: args.linkId },
  });
  if (voteExists) {
    throw new Error(`Already voted for link: ${args.linkId}`);
  }

  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: args.linkId } },
  });
}

module.exports = {
  signup,
  login,
  post,
  vote,
};
