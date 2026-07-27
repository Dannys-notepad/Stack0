export type NewsletterStatus = 'subscribed' | 'unsubscribed'

export type NewsLetter = {
  email: string
  status: NewsletterStatus
  createdAt: string
  updatedAt: string
}

export type NewsletterSubscriptionInput = Pick<NewsLetter, 'email'>
