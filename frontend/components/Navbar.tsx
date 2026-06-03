import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, User, LogOut, Shield, FolderOpen, HelpCircle } from 'lucide-react'
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/router'
import axios from 'axios'

const Navbar = ({
  onDashboard,
  onNavigate,
}: {
  onDashboard?: () => void
  onNavigate?: (sectionId: string) => void
}) => {
  const { data: session } = useSession()
  const currentUser = session?.user
  const router = useRouter()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileUserOpen, setIsMobileUserOpen] = React.useState(false)
  const [openCaseId, setOpenCaseId] = React.useState<number | null>(null)

  const isStaff = (session as any)?.user?.is_staff === true

  const adminUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/')
    .replace(/\/api\/?$/, '/admin/')

  React.useEffect(() => {
    if (!session || isStaff) return
    const token = (session as any).access_token
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}intake/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const submissions = res.data?.results ?? res.data
        if (Array.isArray(submissions) && submissions.length > 0) {
          setOpenCaseId(submissions[0].id)
        }
      })
      .catch(() => {})
  }, [session, isStaff])

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact' },
  ]

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'blog') {
      router.push('/blog')
    } else if (router.pathname !== '/') {
      // If not on home page, navigate home first then maybe scroll
      if (sectionId === 'home') {
        router.push('/')
      } else {
        router.push(`/#${sectionId}`)
      }
    } else if (onNavigate) {
      onNavigate(sectionId)
    } else {
      // Fallback if onNavigate not provided but on home page
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      } else if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
    setIsMobileMenuOpen(false)
    setIsMobileUserOpen(false)
  }

  const getUserDisplayText = () => {
    if (!currentUser) return 'User'
    if ((currentUser as any).username) {
      return (currentUser as any).username
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0] || 'User'
    }
    return 'User'
  }

  return (
    <header 
      style={{ 
        backgroundColor: 'var(--color-navBg)', 
        borderColor: 'var(--color-navBorder)' 
      }} 
      className="shadow-sm border-b sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavClick('home')}
          >
            <img src="/assets/logo.png" alt="TenantGuard" className="h-8 w-8" />
            <span 
              className="text-xl font-bold" 
              style={{ color: 'var(--color-primary)' }}
            >
              TenantGuard
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <motion.div key={item.id} whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
                <Button
                  variant="ghost"
                  style={{ color: 'var(--color-textSecondary)' }}
                  className="relative group transition-colors duration-200"
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 bg-primary rounded-full transition-all duration-300 group-hover:w-4/5" />
                </Button>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden md:inline-flex bg-primary hover:opacity-90 text-white"
              onClick={() => router.push('/intake')}
            >
              Get Help Now
            </Button>
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost" 
                    style={{ color: 'var(--color-textSecondary)' }} 
                    className="hover:opacity-80 flex items-center gap-1"
                  >
                    <User className="h-4 w-4" />
                    <span className="max-w-[150px] truncate">
                      {getUserDisplayText()}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent 
                  align="end" 
                  className="w-56" 
                  style={{ 
                    backgroundColor: 'var(--color-cardBg)', 
                    borderColor: 'var(--color-cardBorder)' 
                  }}
                >
                  <DropdownMenuLabel
                    className="text-right sm:text-left"
                    style={{ color: 'var(--color-text)' }}
                  >
                    <div className="flex flex-col items-end space-y-1 sm:items-start">
                      <p className="text-sm font-medium leading-none">
                        {(currentUser as any).username || 'User'}
                      </p>
                      <p 
                        className="text-xs leading-none" 
                        style={{ color: 'var(--color-textSecondary)' }}
                      >
                        {currentUser?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator
                    style={{ backgroundColor: 'var(--color-cardBorder)' }}
                  />

                  {isStaff ? (
                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer justify-end text-right sm:justify-start sm:text-left"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <a href={adminUrl} target="_blank" rel="noreferrer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Panel</span>
                      </a>
                    </DropdownMenuItem>
                  ) : openCaseId !== null ? (
                    <DropdownMenuItem
                      onClick={() => router.push(`/case/${openCaseId}`)}
                      className="cursor-pointer justify-end text-right sm:justify-start sm:text-left"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>My Case</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => router.push('/intake')}
                      className="cursor-pointer justify-end text-right sm:justify-start sm:text-left"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Get Help</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator
                    style={{ backgroundColor: 'var(--color-cardBorder)' }}
                  />

                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer justify-end text-right text-red-600 focus:text-red-600 sm:justify-start sm:text-left"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                style={{ color: 'var(--color-textSecondary)' }} 
                className="" 
                onClick={() => signIn()}
              >
                Login
              </Button>
            )}

            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                animate={isMobileMenuOpen ? 'open' : 'closed'}
              >
                <motion.line
                  x1="3" y1="6" x2="21" y2="6"
                  variants={{ closed: { rotate: 0, y: 0, opacity: 1 }, open: { rotate: 45, y: 6, opacity: 1 } }}
                  transition={{ duration: 0.25 }}
                />
                <motion.line
                  x1="3" y1="12" x2="21" y2="12"
                  variants={{ closed: { opacity: 1 }, open: { opacity: 0 } }}
                  transition={{ duration: 0.2 }}
                />
                <motion.line
                  x1="3" y1="18" x2="21" y2="18"
                  variants={{ closed: { rotate: 0, y: 0, opacity: 1 }, open: { rotate: -45, y: -6, opacity: 1 } }}
                  transition={{ duration: 0.25 }}
                />
              </motion.svg>
            </Button>
          </div>

        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-nav"
              className="md:hidden border-t overflow-hidden"
              style={{ borderColor: 'var(--color-navBorder)' }}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <nav className="flex flex-col items-start py-2 px-2">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="w-full"
                  >
                    <Button
                      variant="ghost"
                      style={{ color: 'var(--color-textSecondary)' }}
                      className="w-full justify-start text-left hover:opacity-80 h-11"
                      onClick={() => handleNavClick(item.id)}
                    >
                      {item.label}
                    </Button>
                  </motion.div>
                ))}
              </nav>
              <div className="flex flex-col gap-2 pb-4 px-2">
                <Button
                  className="w-full bg-primary hover:opacity-90 text-white h-11"
                  onClick={() => { router.push('/intake'); setIsMobileMenuOpen(false) }}
                >
                  Get Help Now
                </Button>
                {session ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-11"
                      onClick={() => setIsMobileUserOpen((open) => !open)}
                    >
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {getUserDisplayText()}
                      </span>
                      <motion.div animate={{ rotate: isMobileUserOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-auto">
                        <ChevronDown className="h-4 w-4" />
                      </motion.div>
                    </Button>
                    <AnimatePresence>
                      {isMobileUserOpen && (
                        <motion.div
                          className="flex flex-col gap-1 pl-4"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {isStaff ? (
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-11"
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setIsMobileUserOpen(false)
                                window.open(adminUrl, '_blank')
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Panel
                            </Button>
                          ) : openCaseId !== null ? (
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-11"
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setIsMobileUserOpen(false)
                                router.push(`/case/${openCaseId}`)
                              }}
                            >
                              <FolderOpen className="mr-2 h-4 w-4" />
                              My Case
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              className="w-full justify-start h-11"
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setIsMobileUserOpen(false)
                                router.push('/intake')
                              }}
                            >
                              <HelpCircle className="mr-2 h-4 w-4" />
                              Get Help
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            className="w-full justify-start h-11 text-red-600 hover:text-red-600"
                            onClick={() => signOut()}
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11"
                    onClick={() => signIn()}
                  >
                    Login
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Navbar
