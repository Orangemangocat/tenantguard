import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx'
import { ChevronDown, User, LogOut, Settings, Menu, X } from 'lucide-react'

// Import logo asset
import logo from '../assets/logo.png'

/**
 * Navbar Component
 * 
 * A responsive navigation bar with conditional rendering for authenticated users.
 * When logged in, displays user email with a dropdown menu containing Dashboard and Logout options.
 * When logged out, displays a Login button.
 * 
 * @param {Object} props - Component props
 * @param {Object|null} props.currentUser - Current authenticated user object or null
 * @param {string} props.currentUser.email - User's email address
 * @param {string} props.currentUser.name - User's display name
 * @param {string} props.currentUser.role - User's role (admin, editor, viewer)
 * @param {Function} props.onLogin - Callback when Login button is clicked
 * @param {Function} props.onLogout - Callback when Logout is clicked
 * @param {Function} props.onDashboard - Callback when Dashboard is clicked
 * @param {Function} props.onNavigate - Callback for navigation (receives: 'home', 'features', 'how-it-works', 'blog', 'contact')
 */
const Navbar = ({
  currentUser,
  onLogin,
  onLogout,
  onDashboard,
  onNavigate,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isMobileUserOpen, setIsMobileUserOpen] = React.useState(false)
  /**
   * Handle logout action
   * Clears tokens from localStorage and calls the onLogout callback
   */
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    if (onLogout) {
      onLogout()
    }
  }

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'blog', label: 'Blog' },
    { id: 'contact', label: 'Contact' },
  ]

  const handleNavClick = (sectionId) => {
    if (onNavigate) {
      onNavigate(sectionId)
    }
    setIsMobileMenuOpen(false)
    setIsMobileUserOpen(false)
  }

  /**
   * Get display text for the user dropdown trigger
   * Prefer first name, then email prefix, then 'User'
   */
  const getUserDisplayText = () => {
    if (!currentUser) return 'User'
    if (currentUser.name) {
      return currentUser.name.trim().split(/\s+/)[0] || 'User'
    }
    if (currentUser.email) {
      return currentUser.email.split('@')[0] || 'User'
    }
    return 'User'
  }

  /**
   * Get display name for the dropdown header
   * Prioritizes name, falls back to 'User'
   */
  const getUserDisplayName = () => {
    if (!currentUser) return 'User'
    return currentUser.name || 'User'
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
          
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => onNavigate && onNavigate('home')}
          >
            <img src={logo} alt="TenantGuard" className="h-8 w-8" />
            <span 
              className="text-xl font-bold" 
              style={{ color: 'var(--color-primary)' }}
            >
              TenantGuard
            </span>
          </div>

          {/* Main Navigation Links - Hidden on mobile */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                style={{ color: 'var(--color-textSecondary)' }}
                className="hover:opacity-80"
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Conditional User Authentication Section */}
            {currentUser ? (
              /* ========================================
                 LOGGED IN STATE: User Dropdown Menu
                 ======================================== */
              <DropdownMenu>
                {/* Dropdown Trigger - Shows User Email */}
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

                {/* Dropdown Content */}
                <DropdownMenuContent 
                  align="end" 
                  className="w-56" 
                  style={{ 
                    backgroundColor: 'var(--color-cardBg)', 
                    borderColor: 'var(--color-cardBorder)' 
                  }}
                >
                  {/* User Info Header */}
                  <DropdownMenuLabel style={{ color: 'var(--color-text)' }}>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p 
                        className="text-xs leading-none" 
                        style={{ color: 'var(--color-textSecondary)' }}
                      >
                        {currentUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator 
                    style={{ backgroundColor: 'var(--color-cardBorder)' }} 
                  />

                  {/* Dashboard Link (Admin Only) */}
                  {currentUser?.role === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => onDashboard && onDashboard()}
                      className="cursor-pointer"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                  )}

                  {/* Onboarding Link (hide for admin users) */}
                  {currentUser?.role !== 'admin' && (
                    <DropdownMenuItem
                      onClick={() => { window.location.href = '/onboarding'; }}
                      className="cursor-pointer"
                      style={{ color: 'var(--color-text)' }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Onboarding</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator 
                    style={{ backgroundColor: 'var(--color-cardBorder)' }} 
                  />

                  {/* Logout Action */}
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* ========================================
                 LOGGED OUT STATE: Login Button
                 ======================================== */
              <Button 
                variant="ghost" 
                style={{ color: 'var(--color-textSecondary)' }} 
                className="hover:opacity-80" 
                onClick={() => onLogin && onLogin()}
              >
                Login
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              className="md:hidden"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div id="mobile-nav" className="md:hidden border-t" style={{ borderColor: 'var(--color-navBorder)' }}>
            <nav className="flex flex-col py-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  style={{ color: 'var(--color-textSecondary)' }}
                  className="hover:opacity-80 justify-start"
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="flex flex-col gap-2 px-4 pb-4">
              {currentUser ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="justify-between"
                    onClick={() => setIsMobileUserOpen((open) => !open)}
                    aria-expanded={isMobileUserOpen}
                    aria-controls="mobile-user-menu"
                  >
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {getUserDisplayText()}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isMobileUserOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  {isMobileUserOpen && (
                    <div id="mobile-user-menu" className="flex flex-col gap-1 pl-6">
                      {currentUser?.role === 'admin' && (
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setIsMobileUserOpen(false)
                            if (onDashboard) {
                              onDashboard()
                            }
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      )}
                      {currentUser?.role !== 'admin' && (
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            setIsMobileMenuOpen(false)
                            setIsMobileUserOpen(false)
                            window.location.href = '/onboarding'
                          }}
                        >
                          <User className="mr-2 h-4 w-4" />
                          Onboarding
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="justify-start text-red-600 hover:text-red-600"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          setIsMobileUserOpen(false)
                          handleLogout()
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    if (onLogin) {
                      onLogin()
                    }
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
