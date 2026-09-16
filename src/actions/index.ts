import { auth } from '@/features/auth/actions/auth.action';
import { event } from '@features/events/actions/event.action';
import { home } from '@features/home/actions/home.action';
import { register } from '@features/auth/actions/register.action';
import { registration } from '@features/registration/actions/registration.action';

export const server = {
  auth,
  event,
  home,
  register,
  registration,
};
