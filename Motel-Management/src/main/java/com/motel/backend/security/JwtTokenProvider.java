package com.motel.backend.security;

import com.motel.backend.entity.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Chuỗi bí mật dùng để mã hóa Token (Đảm bảo tối thiểu 256-bit / 32 ký tự)
    private static final String JWT_SECRET = "MotelManagementSuperSecretKeyForJWTAuth2026With256BitsLength";

    // Thời gian hết hạn của Token: 1 ngày (86400000 ms)
    private static final long JWT_EXPIRATION = 86400000L;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
    }

    // Sinh Token từ thông tin User
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION);

        return Jwts.builder()
                .setSubject(String.valueOf(user.getId())) // Ép Long -> String
                .claim("username", user.getUsername())
                .claim("role", user.getRole())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // Lấy UserId dạng Long từ Token
    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return Long.parseLong(claims.getSubject()); // Ép String -> Long
    }
}