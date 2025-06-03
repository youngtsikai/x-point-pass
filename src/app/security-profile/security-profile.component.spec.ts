import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityProfileComponent } from './security-profile.component';

describe('SecurityProfileComponent', () => {
  let component: SecurityProfileComponent;
  let fixture: ComponentFixture<SecurityProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
